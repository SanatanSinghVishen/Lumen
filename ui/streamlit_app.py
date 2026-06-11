import streamlit as st
import requests

API_URL = "http://localhost:8000"

st.set_page_config(page_title="LUMEN Reviewer", layout="wide")
st.title("LUMEN Human-in-the-Loop Review")

st.sidebar.header("Find Thread")
thread_id = st.sidebar.text_input("Thread ID")

if thread_id:
    try:
        resp = requests.get(f"{API_URL}/review/{thread_id}")
        if resp.status_code == 200:
            data = resp.json()
            score = data.get("eval_score", 0.0)
            draft = data.get("draft_report", "")
            
            st.metric("Evaluation Score", f"{score * 100:.1f}%")
            st.progress(score)
            
            st.markdown("### Draft Report")
            edited_draft = st.text_area("Edit Draft Inline (if needed)", value=draft, height=400)
            
            st.markdown("### Actions")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("Approve", type="primary"):
                    res = requests.post(f"{API_URL}/approve/{thread_id}", json={"action": "approve"})
                    st.success("Approved and final report generated!")
                    
            with col2:
                if st.button("Save Edits & Approve"):
                    res = requests.post(f"{API_URL}/approve/{thread_id}", json={"action": "edit", "edits": edited_draft})
                    st.success("Edits saved and approved!")
                    
            with col3:
                notes = st.text_input("Rejection notes / Retry hints")
                if st.button("Reject & Retry"):
                    res = requests.post(f"{API_URL}/approve/{thread_id}", json={"action": "reject", "notes": notes})
                    st.warning("Rejected. Graph will retry with hints.")
                    
        else:
            st.error("Thread not found or not paused at HITL.")
    except Exception as e:
        st.error(f"Error connecting to API: {e}")
